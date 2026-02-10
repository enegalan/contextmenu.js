import { buildSearchIndex } from "@/lib/search-index";
import { NextResponse } from "next/server";

export async function GET() {
  const index = buildSearchIndex();
  return NextResponse.json(index);
}
