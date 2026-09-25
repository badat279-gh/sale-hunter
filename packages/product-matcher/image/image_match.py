import io
import json
import sys
import urllib.request

from PIL import Image
import imagehash


def fetch_image(url: str) -> Image.Image:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        data = response.read()

    return Image.open(io.BytesIO(data)).convert("RGB")


def calc_hash(image: Image.Image):
    return imagehash.phash(image)


def similarity(hash_a, hash_b):
    distance = hash_a - hash_b
    max_distance = hash_a.hash.size

    score = 1 - (distance / max_distance)

    return round(max(0.0, min(1.0, score)), 4)


def main():
    if len(sys.argv) != 3:
        print(
            json.dumps(
                {
                    "ok": False,
                    "message": "Usage: image_match.py <source_url> <candidate_url>",
                }
            )
        )
        sys.exit(1)

    source_url = sys.argv[1]
    candidate_url = sys.argv[2]

    try:
        source_image = fetch_image(source_url)
        candidate_image = fetch_image(candidate_url)

        source_hash = calc_hash(source_image)
        candidate_hash = calc_hash(candidate_image)

        score = similarity(source_hash, candidate_hash)

        print(
            json.dumps(
                {
                    "ok": True,
                    "source_hash": str(source_hash),
                    "candidate_hash": str(candidate_hash),
                    "hash_distance": int(source_hash - candidate_hash),
                    "image_similarity": score,
                }
            )
        )

    except Exception as error:
        print(
            json.dumps(
                {
                    "ok": False,
                    "message": str(error),
                }
            )
        )
        sys.exit(2)


if __name__ == "__main__":
    main()

