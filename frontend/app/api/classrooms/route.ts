import { NextRequest, NextResponse } from "next/server";
import { getServerUser, authResponse } from "@/src/lib/auth";
import { ClassroomService } from "@/src/services/classroomService";

export async function GET(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse("Unauthorized");

  try {
    if (user.role === "coach") {
      const classrooms = await ClassroomService.listClassrooms({
        coachId: user.id,
      });
      return NextResponse.json({ classrooms });
    } else if (["academy_admin", "super_admin"].includes(user.role)) {
      const classrooms = await ClassroomService.listClassrooms({
        academyId: user.academyId,
      });
      return NextResponse.json({ classrooms });
    }
    return NextResponse.json({ classrooms: [] });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse("Unauthorized");
  if (!["academy_admin", "super_admin", "coach"].includes(user.role)) {
    return authResponse("Forbidden", 403);
  }

  try {
    const body = await req.json();
    const classroom = await ClassroomService.create({
      ...body,
      coachId: user.id,
      academyId: user.academyId
    });
    return NextResponse.json({ classroom, message: "Class scheduled" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed" },
      { status: 500 },
    );
  }
}
