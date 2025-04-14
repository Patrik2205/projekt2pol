import { NextResponse } from 'next/server'
import { prisma } from '@/app/api/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"
import bcrypt from 'bcrypt'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)
    const json = await request.json()
    const { username, email, firstName, lastName, currentPassword, newPassword } = json

    // Verify current user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      })

      return NextResponse.json({ message: 'Password updated successfully' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email,
        firstName,
        lastName
      }
    })

    return NextResponse.json({
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
} 