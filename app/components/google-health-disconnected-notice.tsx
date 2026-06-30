import Link from "next/link";

export function GoogleHealthDisconnectedNotice({ slug }: { slug: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      <p className="font-medium">Google Health disconnected</p>
      <p className="mt-1">
        Your refresh token expired or was revoked. Reconnect Google in manage
        settings — you do not need to delete your profile.
      </p>
      <Link
        href={`/p/${slug}/manage`}
        className="mt-2 inline-block font-medium text-red-800 underline dark:text-red-100"
      >
        Reconnect Google →
      </Link>
    </div>
  );
}
