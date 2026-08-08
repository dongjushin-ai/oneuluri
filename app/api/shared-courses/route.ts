import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseAdminConfigurationError } from "@/lib/supabase/admin";
import {
  createSharedCourse,
  SharedCourseRepositoryError,
  sharedCourseInputSchema,
} from "@/lib/supabase/shared-courses";

interface ApiErrorBody {
  error: { code: string; message: string };
}

function errorResponse(status: number, code: string, message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "요청 본문이 올바른 JSON이 아닙니다.");
  }

  const parsed = sharedCourseInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_REQUEST", z.prettifyError(parsed.error));
  }

  try {
    const id = await createSharedCourse(parsed.data.request, parsed.data.course);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof SupabaseAdminConfigurationError) {
      return errorResponse(503, error.code, "공유 기능이 아직 설정되지 않았습니다.");
    }
    if (error instanceof SharedCourseRepositoryError) {
      return errorResponse(502, error.code, "공유 코스를 저장하지 못했습니다.");
    }
    return errorResponse(500, "INTERNAL_ERROR", "공유 코스를 저장하는 중 오류가 발생했습니다.");
  }
}
