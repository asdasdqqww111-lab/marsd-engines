from flask import Flask, request, render_template, jsonify
from factcheck.utils.llmclient import CLIENTS
import argparse

from factcheck.utils.utils import load_yaml
from factcheck import FactCheck

from health import health_bp
from result_store import store_result, load_result

app = Flask(__name__, static_folder="assets")

# HUDHUD health contract — registered unconditionally, before any CLI-only setup.
app.register_blueprint(health_bp)


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


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        response = request.form["response"]
        if response == "":
            return render_template("input.html")

        # HUDHUD fix C-01: the pipeline is still CLI-initialized in __main__.
        # If an operator started the app without a factcheck instance (or the
        # LLM/retriever backend is unavailable), report it honestly instead of
        # crashing or fabricating results.
        if "factcheck_instance" not in globals():
            return (
                render_template(
                    "input.html",
                    hudhud_error="تحليل التحقق غير مهيأ حالياً. يجب تشغيل الخادم عبر الواجهة الرئيسية (webapp) مع تهيئة مزود التحليل.",
                ),
                503,
            )

        try:
            result = factcheck_instance.check_text(response)
        except Exception as exc:  # LLM/retriever outage, quota, timeout...
            app.logger.error("FactCheck pipeline failure: %s", exc)
            return (
                render_template(
                    "input.html",
                    hudhud_error="تعذر إجراء التحليل الآن — مزود الذكاء الاصطناعي أو مصادر الاسترجاع غير متاحة. لم يتم توليد أي نتيجة.",
                ),
                503,
            )

        # HUDHUD fix C-01: store isolated per-request result and redirect to
        # its stable URL (id is opaque, unique, and never derived from content).
        result_id = store_result(result)

        from flask import redirect, url_for

        return redirect(url_for("get_content", content_id=result_id, _external=False))

    return render_template("input.html")


@app.route("/shownClaim/<content_id>")
def get_content(content_id):
    # HUDHUD fix C-01: load from the isolated store instead of a shared file.
    # Invalid or unknown IDs render a clear error — no cross-request leakage.
    response = load_result(content_id)
    if response is None:
        return (
            render_template(
                "input.html",
                hudhud_error="نتيجة التحقق غير موجودة أو منتهية. أدخل النص مرة أخرى لبدء فحص جديد.",
            ),
            404,
        )

    shown_index = 0
    claim_detail = response.get("claim_detail", [])
    if isinstance(claim_detail, list) and claim_detail:
        try:
            shown_index = max(0, min(int(content_id_shown_override or 0), len(claim_detail) - 1))
        except Exception:
            shown_index = 0

    return render_template(
        "LibrAI_fc.html", responses=response, shown_claim=shown_index
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