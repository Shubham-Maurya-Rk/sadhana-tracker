import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // 1. Basic Validation
    if (!name || !email || !password) {
      return new NextResponse("Missing Fields", { status: 400 });
    }

    // 2. Check if user exists
    const exist = await prisma.user.findUnique({
      where: { email }
    });

    if (exist) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.log(error);
    return new NextResponse(error.message, { status: 500 });
  }
}