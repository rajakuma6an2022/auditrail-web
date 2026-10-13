import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchMe } from "./auth-api";
import { getEvent, getFacets, listEvents, type Filters } from "./events-api";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), staleTime: 5 * 60_000 });

export const useFacets = () =>
  useQuery({ queryKey: ["facets"], queryFn: ({ signal }) => getFacets(signal), staleTime: 5 * 60_000 });

export const useEvent = (id: string) =>
  useQuery({ queryKey: ["event", id], queryFn: ({ signal }) => getEvent(id, signal) });

// Cursor-based infinite list. Cached per filter set, so going back from an event restores the list instantly.
export const useEventList = (filters: Filters, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ["events", filters],
    queryFn: ({ pageParam, signal }) => listEvents(filters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
