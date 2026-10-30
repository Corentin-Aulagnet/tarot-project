import TrickGameForm from "@/components/TrickGameForm";

export default async function EditCoincheGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <TrickGameForm variant="coinche" gameId={gameId} />;
}
