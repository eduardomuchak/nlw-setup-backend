import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma';
import dayjs from 'dayjs';

export async function appRoutes(app: FastifyInstance) {
  app.post('/habits', async (request) => {
    // Validate request body
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });

    const { title, weekDays } = createHabitBody.parse(request.body);

    const today = dayjs().startOf('day').toDate();

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map((day) => {
            return {
              week_day: day,
            };
          }),
        },
      },
    });
  });

  app.get('/day', async (request) => {
    const getDayParams = z.object({
      // Convert string to date
      date: z.coerce.date(),
    });

    const { date } = getDayParams.parse(request.query);

    const pardedDate = dayjs(date).startOf('day');
    const weekDay = pardedDate.get('day');

    // Get all habits that were created before the date and have the week day
    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    });

    //
    const day = await prisma.day.findUnique({
      where: {
        date: pardedDate.toDate(),
      },
      include: {
        habitsDay: true,
      },
    });

    const completedHabitsIds = day?.habitsDay.map((habitDay) => {
      return habitDay.habit_id;
    });

    return { possibleHabits, completedHabitsIds };
  });
}
