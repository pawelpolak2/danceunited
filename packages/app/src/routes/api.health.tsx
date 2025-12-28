import { prisma } from 'db'

// Example API route - health check endpoint
export async function loader() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
