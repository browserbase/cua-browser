import { cn } from "@/lib/utils";
import { SessionLiveURLs } from "@browserbasehq/sdk/resources/index.mjs";
import { useEffect, useState } from "react";

let abortController: AbortController | null = null;
let errors = 0;
async function getPages(sessionId: string) {
  try {
    // abort any previous requests
    if (abortController) {
      abortController.abort("Aborted previous request");
    }
    abortController = new AbortController();
    const res = await fetch(`/api/session/${sessionId}/pages`, {
      signal: abortController.signal,
    });

    // retry 3 times if the request fails
    if (!res.ok) {
      errors++;
      if (errors > 3) {
        throw new Error("Failed to fetch pages");
      }
      return [];
    }

    const data = await res.json();
    errors = 0;
    return data.pages;
  } catch (error: unknown) {
    // abort error is expected when the request is aborted
    if (
      (error instanceof Error && error.name === "AbortError") ||
      error === "Aborted previous request"
    ) {
      return [];
    }

    console.error("Error fetching pages:", error);
    return [];
  }
}

const refetchInterval = 5000;

export default function BrowserTabs({
  sessionId,
  activePage,
  setActivePage,
}: {
  sessionId: string;
  activePage: SessionLiveURLs.Page | null;
  setActivePage: (page: SessionLiveURLs.Page) => void;
}) {
  const [pages, setPages] = useState<SessionLiveURLs.Page[]>([]);

  useEffect(() => {
    const refetchPages = async () => {
      const p = await getPages(sessionId);
      // when a new page is added, set the active page to the last page
      if (p.length > pages.length) {
        setActivePage(p[p.length - 1]);
      }

      setPages(p);
    };

    refetchPages();
    const interval = setInterval(refetchPages, refetchInterval);

    return () => clearInterval(interval);
  }, [pages.length, sessionId, setActivePage]);

  // fallback to first page if activePageId is not found
  useEffect(() => {
    if (!activePage && pages.length > 0) {
      setActivePage(pages[0]);
    }
  }, [activePage, pages, setActivePage]);

  if (pages.length === 0 || !activePage) {
    return null;
  }

  const tabLoading = (t: SessionLiveURLs.Page) => !Boolean(t.title || t.url);

  // hide tabs if there is only one page
  if (pages.length < 2) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto max-w-[1000px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div
        className="grid gap-2 w-full justify-start"
        style={{
          gridTemplateColumns: `repeat(${pages.length}, minmax(100px,300px))`,
        }}
      >
        {pages.map((page) => (
          <div
            key={page.id}
            onClick={() => setActivePage(page)}
            className={cn(
              "bg-[rgb(248,248,255)] rounded-[2px] text-gray-500 border border-[rgb(245,235,255)] text-sm flex gap-x-1 py-1 px-1.5 max-w-[300px] cursor-pointer hover:border-gray-400",
              {
                "bg-[rgb(245,240,255)] text-gray-800 border-[rgb(179,170,170)]":
                  page.id === activePage?.id,
              }
            )}
          >
            {page.faviconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.faviconUrl} alt={page.title} className="size-3" />
            )}
            {tabLoading(page) ? (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            ) : (
              <span className="truncate text-ellipsis whitespace-nowrap">
                {page.title || page.url}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
