export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerUser, authResponse } from "@/src/lib/auth";
import { ClassroomService } from "@/src/services/classroomService";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getServerUser(req);
  if (!user) return authResponse("Unauthorized");
  if (!["coach", "academy_admin", "super_admin"].includes(user.role)) {
    return authResponse("Forbidden", 403);
  }

  try {
    await ClassroomService.end(params.id);
    return NextResponse.json({ message: "Class ended" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed" },
      { status: 500 },
    );
  }
}
