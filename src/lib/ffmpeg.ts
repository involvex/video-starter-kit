import type { MediaItem } from "@/data/schema";
import { fal } from "./fal";
import { resolveMediaUrl } from "./utils";

export async function getMediaMetadata(
  media: MediaItem,
): Promise<{ media?: unknown } | null> {
  const mediaUrl = resolveMediaUrl(media);
  if (!mediaUrl) {
    return null;
  }

  try {
    const { data: mediaMetadata } = await fal.subscribe(
      "fal-ai/ffmpeg-api/metadata",
      {
        input: {
          media_url: mediaUrl,
          extract_frames: true,
        },
        mode: "streaming",
      },
    );

    return mediaMetadata;
  } catch (error) {
    console.error(error);
    return null;
  }
}
