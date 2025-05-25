import { prisma } from '../prisma'
import type { User, Prisma } from '../../../prisma/generated'

export class UserDAO {
  static async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.user.create({
      data
    })
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    })
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    })
  }

  static async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) {
    return prisma.user.update({
      where: { id },
      data
    })
  }

  static async delete(id: string) {
    return prisma.user.delete({
      where: { id }
    })
  }

  static async list(params?: {
    skip?: number
    take?: number
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
  }) {
    const { skip, take, where, orderBy } = params ?? {}
    return prisma.user.findMany({
      skip,
      take,
      where,
      orderBy
    })
  }
} 