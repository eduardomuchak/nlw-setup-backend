import dayjs from 'dayjs';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma';

export async function appRoutes(app: FastifyInstance) {
  // GET ROUTES
  app.get('/', async () => {
    return { message: 'Hello World!' };
  });

  app.get('/day', async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date(),
    });

    const { date } = getDayParams.parse(request.query);

    const parsedDate = dayjs(date).startOf('day');
    const weekDay = parsedDate.get('day');

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

    const day = await prisma.day.findFirst({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dayHabits: true,
      },
    });

    const completedHabits =
      day?.dayHabits.map((dayHabit) => {
        return dayHabit.habit_id;
      }) ?? [];

    return {
      possibleHabits,
      completedHabits,
    };
  });

  app.get('/summary', async () => {
    const summary: any = await prisma.$queryRaw`
      SELECT 
        D.id, 
        D.date,
        (
          SELECT 
            count(distinct DH.habit_id)::int4
          FROM day_habits DH
          WHERE DH.day_id = D.id
        ) as completed,
        (
          SELECT
            count(distinct HDW.habit_id)::int4
          FROM habit_week_days HDW
          JOIN habits H
            ON H.id = HDW.habit_id
          WHERE
            HDW.week_day = (extract(isodow from D.date) - 1)
            AND date_trunc('day',H.created_at) = date_trunc('day',D.date)
        ) as amount
      FROM days D
    `;

    if (summary.length === 0) {
      return [
        {
          id: '',
          date: new Date(),
          completed: 0,
          amount: 0,
        },
      ];
    }

    return summary;
  });

  app.get('/habits', async () => {
    const habits = await prisma.habit.findMany({
      include: {
        weekDays: true,
      },

      orderBy: {
        created_at: 'asc',
      },
    });

    return habits;
  });

  // POST ROUTES
  app.post('/habits', async (request) => {
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
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            };
          }),
        },
      },
    });

    return {
      message: 'Habit created',
    };
  });

  // PATCH ROUTES
  app.patch('/habits/:id', async (request) => {
    const updateHabitParams = z.object({
      id: z.string().uuid(),
    });

    const updateHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });

    const { id } = updateHabitParams.parse(request.params);
    const { title, weekDays } = updateHabitBody.parse(request.body);

    await prisma.habit.update({
      where: {
        id,
      },
      data: {
        title,
        weekDays: {
          deleteMany: {},
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            };
          }),
        },
      },
    });

    return {
      message: 'Habit updated',
      habit: {
        id,
        title,
        weekDays,
      },
    };
  });

  app.patch('/habits/:id/toggle', async (request) => {
    const toggleHabitParams = z.object({
      id: z.string().uuid(),
    });

    const { id } = toggleHabitParams.parse(request.params);

    const today = dayjs().startOf('day').toDate();

    let day = await prisma.day.findUnique({
      where: {
        date: today,
      },
    });

    if (!day) {
      day = await prisma.day.create({
        data: {
          date: today,
        },
      });
    }

    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        },
      },
    });

    if (dayHabit) {
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id,
        },
      });
    } else {
      await prisma.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
        },
      });
    }

    return {
      message: 'Habit progress updated',
    };
  });

  // DELETE ROUTES
  app.delete('/habits/:id', async (request) => {
    const deleteHabitParams = z.object({
      id: z.string().uuid(),
    });

    const { id } = deleteHabitParams.parse(request.params);

    // Delete related records in HabitWeekDays
    await prisma.habitWeekDays.deleteMany({
      where: { habit_id: id },
    });
    // Delete related records in DayHabit
    await prisma.dayHabit.deleteMany({
      where: { habit_id: id },
    });
    // Delete the habit
    await prisma.habit.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Habit deleted',
    };
  });
}
