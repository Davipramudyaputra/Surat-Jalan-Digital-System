import { notFound } from "next/navigation";

import { DeliveryNoteDocument } from "@/components/delivery-note-template/DeliveryNoteDocument";
import { getDeliveryNoteForPreview } from "@/features/delivery-notes/queries";
import { verifyRenderToken } from "@/features/pdf/lib/render-token";
import {
  resolvePaperProfile,
  type PaperOrientation,
  type PaperSizeId,
} from "@/lib/delivery-note-template/paper-profiles";
import { mapDeliveryNoteToDocument } from "@/lib/delivery-note-template/mapper";

export const dynamic = "force-dynamic";

/**
 * Internal render route untuk PDF.
 *
 * Route ini hanya bisa diakses dengan render token ephemeral (HMAC) yang
 * dibentuk server-side. Tidak ada app shell, hanya canonical DeliveryNoteDocument.
 */
export default async function RenderSuratJalanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyRenderToken(token);

  if (!payload) {
    notFound();
  }

  const deliveryNote = await getDeliveryNoteForPreview(payload.deliveryNoteId);
  if (!deliveryNote) {
    notFound();
  }

  const resolution = resolvePaperProfile(
    payload.paper as PaperSizeId,
    payload.orientation as PaperOrientation,
    {
      widthMm: payload.width ?? 250,
      heightMm: payload.height ?? 180,
      marginMm: payload.margin ?? 7,
      orientation: payload.orientation as PaperOrientation,
    },
  );

  // Jika profile custom tidak valid, gunakan fallback aman (Setengah Folio).
  const profile = resolution.profile;
  const data = mapDeliveryNoteToDocument(deliveryNote);

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        background: "#fff",
        width: "100%",
      }}
    >
      <DeliveryNoteDocument data={data} paperProfile={profile} />
    </div>
  );
}
