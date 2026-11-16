import type { Metadata } from 'next';
import Link from 'next/link';
import CutoutView from '@/components/cutout/CutoutView';
import { boxProblem, parseBox } from '@/lib/cutout';

export const metadata: Metadata = {
  title: 'Cut-out',
  description: 'A piece of the OSIRIS map in 3D, with the CCTV cameras and network hosts inside it.',
  robots: { index: false },
};

/**
 * `/cutout?bbox=west,south,east,north`: a box of the map opened on its own.
 *
 * HUDHUD M-06 — this screen is intentionally standalone (shareable bbox links),
 * but it was previously unreachable through navigation once opened. A persistent
 * header link back to the full map is added here — additive only, the cutout
 * screen itself and its shareable-link behavior are unchanged.
 */
export default async function CutoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const box = parseBox(typeof q.bbox === 'string' ? q.bbox : null);
  const problem = box ? boxProblem(box) : 'This link has no area in it. Draw a cut-out on the OSIRIS map to make one.';
  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-[#D4AF37]/30 bg-black/80 px-4 py-2 backdrop-blur">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#D4AF37]">OSIRIS · Cut-out</span>
        <Link
          href="/"
          className="rounded-md border border-[#D4AF37]/50 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Open the map
        </Link>
      </header>
      <CutoutView box={box} problem={problem} />
    </>
  );
}
