from flask import Flask, request, render_template, jsonify, make_response
from factcheck.utils.llmclient import CLIENTS
import argparse

from factcheck.utils.utils import load_yaml
from factcheck import FactCheck

from health import health_bp
from result_store import store_result, load_result, _is_valid_result_id

app = Flask(__name__, static_folder="assets")

# HUDHUD health contract — registered unconditionally, before any CLI-only setup.
app.register_blueprint(health_bp)

# Cookie name holding the browser's most recent verification result ID.
# The original template's claim-switching JS navigates to /shownClaim/<claim_no>
# (an integer). To keep that template 100% unmodified, the integer is resolved
# against the per-browser cookie below: every browser only ever reaches its own
# result, so concurrent users never mix results (HUDHUD fix C-01).
RESULT_COOKIE = "hudhud_last_result"
RESULT_COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days


def _claim_index_or_none(content_id):
    """Return int(claim_no) if content_id is a plain positive integer."""
    try:
        n = int(content_id)
        return n if n > 0 else None
    except (TypeError, ValueError):
        return None


# Define the custom filter
def zip_lists(a, b):
    return zip(a, b)


# Register the filter with the Jinja2 environment
app.jinja_env.filters["zip"] = zip_lists


# Occurrences count filter
def count_occurrences(input_dict, target_string, key):
    input_list = [item[key] for item in input_dict]
    return input_list.count(target_string)


app.jinja_env.filters["count_occurrences"] = count_occurrences


# Occurrences count filter
def filter_evidences(input_dict, target_string, key):
    return [item for item in input_dict if target_string == item[key]]


app.jinja_env.filters["filter_evidences"] = filter_evidences


def _render_unavailable(message, status=503):
    return render_template("input.html", hudhud_error=message), status


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        response = request.form.get("response", "")
        if response == "":
            return render_template("input.html")

        # HUDHUD fix C-01: the pipeline is CLI-initialized in __main__. If the
        # app is running without a factcheck instance, or the LLM/retriever
        # backend fails, report it honestly — never fabricate a result.
        fc = globals().get("factcheck_instance")
        if fc is None:
            return _render_unavailable(
                "تحليل التحقق غير مهيأ حالياً — يجب تشغيل الخادم عبر webapp مع تهيئة مزود التحليل. لم يتم توليد أي نتيجة."
            )

        try:
            result = fc.check_text(response)
        except Exception as exc:  # LLM/retriever outage, quota, timeout...
            app.logger.error("FactCheck pipeline failure: %s", exc)
            return _render_unavailable(
                "تعذر إجراء التحليل الآن — مزود الذكاء الاصطناعي أو مصادر الاسترجاع غير متاحة. لم يتم توليد أي نتيجة."
            )

        # HUDHUD fix C-01: isolated storage + per-browser binding via cookie.
        result_id = store_result(result)
        resp = make_response(render_template(
            "LibrAI_fc.html", responses=result, shown_claim=0, result_id=result_id
        ))
        resp.set_cookie(
            RESULT_COOKIE, result_id,
            max_age=RESULT_COOKIE_MAX_AGE, httponly=True, samesite="Lax",
        )
        return resp

    return render_template("input.html")


@app.route("/shownClaim/<content_id>")
def get_content(content_id):
    # HUDHUD fix C-01: content_id is either
    #   * a 32-hex result ID  -> direct link to a specific stored result, or
    #   * an integer claim no  -> the browser's own latest result (via cookie),
    #     exactly matching the template's original switchClaim JS.
    shown_claim = 0

    if _is_valid_result_id(content_id):
        result_id = content_id
        response = load_result(result_id)
    else:
        claim_no = _claim_index_or_none(content_id)
        if claim_no is None:
            return _render_unavailable(
                "نتيجة التحقق غير موجودة أو منتهية. أدخل النص مرة أخرى لبدء فحص جديد.",
                status=404,
            )
        result_id = request.cookies.get(RESULT_COOKIE)
        if not _is_valid_result_id(result_id):
            return _render_unavailable(
                "نتيجة التحقق غير موجودة أو منتهية. أدخل النص مرة أخرى لبدء فحص جديد.",
                status=404,
            )
        response = load_result(result_id)
        shown_claim = claim_no - 1

    if response is None:
        return _render_unavailable(
            "نتيجة التحقق غير موجودة أو منتهية. أدخل النص مرة أخرى لبدء فحص جديد.",
            status=404,
        )

    claim_detail = response.get("claim_detail", [])
    if isinstance(claim_detail, list) and claim_detail:
        shown_claim = max(0, min(shown_claim, len(claim_detail) - 1))

    return render_template(
        "LibrAI_fc.html", responses=response, shown_claim=shown_claim, result_id=result_id
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="gpt-4o")
    parser.add_argument("--client", type=str, default=None, choices=CLIENTS.keys())
    parser.add_argument("--prompt", type=str, default="chatgpt_prompt")
    parser.add_argument("--retriever", type=str, default="serper")
    parser.add_argument("--modal", type=str, default="text")
    parser.add_argument("--input", type=str, default="demo_data/text.txt")
    parser.add_argument("--api_config", type=str, default="factcheck/config/api_config.yaml")
    args = parser.parse_args()

    # Load API config from yaml
    try:
        api_config = load_yaml(args.api_config)
    except Exception as e:
        print(f"Error loading api config: {e}")
        api_config = {}

    factcheck_instance = FactCheck(
        default_model=args.model,
        api_config=api_config,
        prompt=args.prompt,
        retriever=args.retriever,
    )

    app.run(host="0.0.0.0", port=2024, debug=True)