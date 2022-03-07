import Link from "next/link";

export default function Layout(props: { children: any }) {
  return (
    <div className="w-full">
      <div className="border-b">
        <nav className="px-4 pt-4 pb-4 mx-auto max-w-3xl flex flex-flex items-center justify-between">
          <Link href="/">
            <a className="font-bold hover:opacity-50 text-center sm:text-lg text-sm m-0 p-0">
              OpenMetaGraph
            </a>
          </Link>

          <div className="flex gap-1 items-center">
            <a
              href="/studio"
              className=" underline text-sm px-2 flex justify-between items-center p-1 rounded-sm hover:opacity-50 cursor-pointer"
            >
              studio
            </a>
            <a
              target={"_blank"}
              href="https://github.com/rebase-foundation/openmetagraph"
              className=" font-bold text-sm px-2 flex justify-between items-center p-1 rounded-sm hover:opacity-50 cursor-pointer"
            >
              <img src="/github.svg" height={14} width={24} className="h-4" />
            </a>
          </div>
        </nav>
      </div>

      {props.children}
    </div>
  );
}
