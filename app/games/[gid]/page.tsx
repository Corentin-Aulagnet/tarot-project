import NewGamePage from "../new/page";

export default async function Page({ params }: { params: Promise<{ gid: string }> }) {
  const { gid } = await params;
  return <NewGamePage gameId={gid} />;
}
