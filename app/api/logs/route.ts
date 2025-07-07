import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.errorLog.findMany({});

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("get error log error:", error);

    return NextResponse.json(
      { message: "fail get error log" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json({ message: "body 是必需的" }, { status: 400 });
    }

    const newUser = await prisma.errorLog.create({
      data: {
        source: body.source,
        info: JSON.stringify(body)
      },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("创建用户失败:", error);

    return NextResponse.json({ message: "创建用户失败" }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
