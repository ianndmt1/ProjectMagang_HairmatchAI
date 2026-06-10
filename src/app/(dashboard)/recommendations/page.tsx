import type { Metadata } from 'next';
import RecommendationsClient from './ui/RecommendationsClient';

export const metadata: Metadata = {
  title: 'Rekomendasi Rambut',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RecommendationsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const faceShape = typeof searchParams.faceShape === 'string' ? searchParams.faceShape : undefined;

  return <RecommendationsClient initialFaceShape={faceShape} />;
}
