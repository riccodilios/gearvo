import { ListPageSkeleton } from '@/components/skeletons/PageSkeletons';

/** Page-slot only — real sidebar/header already wrap children via (app)/layout. */
export default function AppLoading() {
  return <ListPageSkeleton cards />;
}
