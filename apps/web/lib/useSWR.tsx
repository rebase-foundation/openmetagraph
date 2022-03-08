import useSWRInternal from "swr";

// @ts-ignore
const fetcher = (...args: any) => fetch(...args).then((res) => res.json());

export function useSWR<T>(url: any) {
  return useSWRInternal<T>(url, fetcher);
}
