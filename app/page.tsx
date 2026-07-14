import Downloader from "./downloader";
import { siteUrl } from "@/lib/site";

// Single source for the visible FAQ and the FAQPage JSON-LD — they must match.
const faqs: Array<{ q: string; a: string }> = [
  {
    q: "Is this RedGifs downloader free?",
    a: "Yes, completely free. There's no account, no signup, and no download limit.",
  },
  {
    q: "What's the difference between HD and SD?",
    a: "HD is the original full-resolution MP4 as uploaded to RedGifs. SD is a smaller, mobile-friendly encode that downloads faster and uses less storage. If the quality you pick isn't available for a video, the other one is served automatically.",
  },
  {
    q: "Does it work on iPhone and Android?",
    a: "Yes. Downloads are ordinary file links, so your phone's browser handles them with its native download manager. On iPhone, Safari saves videos to the Downloads folder in the Files app; on Android they go to your Downloads folder.",
  },
  {
    q: "Do downloaded videos have a watermark?",
    a: "No. You get the original MP4 file from RedGifs — nothing is re-encoded, compressed, or stamped with a watermark.",
  },
  {
    q: "Where do downloaded files go?",
    a: "Wherever your browser normally saves downloads: the Downloads folder on desktop and Android, or the Files app on iPhone and iPad.",
  },
  {
    q: "Do I need a RedGifs account?",
    a: "No. You don't need an account on RedGifs or on this site — just paste a link.",
  },
  {
    q: "Which RedGifs links are supported?",
    a: "Any redgifs.com watch or share URL, v3.redgifs.com and i.redgifs.com links, direct media links, or just the video's ID on its own.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "RedGifs Downloader",
      url: siteUrl,
      description:
        "Free web app for downloading RedGifs videos as MP4 files in HD or SD.",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <main className="container">
      <h1>RedGifs Downloader</h1>
      <p className="tagline">
        Download any RedGifs video as an MP4 in HD or SD — free, fast, and no
        account required.
      </p>

      <Downloader />

      <div className="content">
        <section>
          <h2>How to Download a RedGifs Video</h2>
          <ol className="steps">
            <li>
              <strong>Copy the video link.</strong> On redgifs.com, use the
              share button or copy the URL from your browser&apos;s address
              bar. Watch pages, share links, v3 and i.redgifs.com links, or
              just the video ID all work.
            </li>
            <li>
              <strong>Paste it above and click Fetch.</strong> A preview card
              appears with the video&apos;s title, length, and resolution so
              you can confirm it&apos;s the right one.
            </li>
            <li>
              <strong>Choose HD or SD.</strong> The MP4 saves through your
              browser&apos;s normal download manager — to the Downloads folder
              on desktop and Android, or the Files app on iPhone.
            </li>
          </ol>
        </section>

        <section>
          <h2>Features</h2>
          <ul className="features">
            <li>Free to use — no signup, no limits</li>
            <li>Original-quality HD and space-saving SD MP4 downloads</li>
            <li>No watermark — you get the untouched video file</li>
            <li>Works on iPhone, Android, and any desktop browser</li>
            <li>Clean filenames, direct to your downloads folder</li>
          </ul>
        </section>

        <section>
          <h2>Frequently Asked Questions</h2>
          {faqs.map(({ q, a }) => (
            <div className="faq" key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </section>

        <footer>
          <p>
            This site is not affiliated with RedGifs. Please download only
            content you have the right to save.
          </p>
        </footer>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
