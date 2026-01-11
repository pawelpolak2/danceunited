import { ShinyText } from '../components/ui'

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mb-12">
          <ShinyText as="h1" variant="title" className="inline-block text-5xl">
            Pricing
          </ShinyText>
        </div>

        <div className="mx-auto max-w-5xl space-y-16">
          {/* Group Classes Table */}
          <div>
            <div className="mb-6 text-center">
              <ShinyText as="h2" variant="title" className="inline-block text-3xl text-gold">
                Group Classes
              </ShinyText>
            </div>
            <div className="overflow-hidden rounded-xl border border-amber-900/30 bg-gray-900/40 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-amber-900/30 border-b bg-gray-900/60 text-gold">
                      <th className="px-6 py-4 font-cinzel font-semibold">Group</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Age</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Duration</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Monthly Pass</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Pass + Ballet</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Single Lesson</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 text-gray-300">
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Basic</td>
                      <td className="px-6 py-4">4-7</td>
                      <td className="px-6 py-4">45 min</td>
                      <td className="px-6 py-4">200 zł</td>
                      <td className="px-6 py-4">320 zł</td>
                      <td className="px-6 py-4">50 zł</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Basic Youth</td>
                      <td className="px-6 py-4">8-15</td>
                      <td className="px-6 py-4">60 min</td>
                      <td className="px-6 py-4">200 zł</td>
                      <td className="px-6 py-4">350 zł</td>
                      <td className="px-6 py-4">50 zł</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Sport - Younger</td>
                      <td className="px-6 py-4">5-7</td>
                      <td className="px-6 py-4">60 min</td>
                      <td className="px-6 py-4">200 zł</td>
                      <td className="px-6 py-4">320 zł</td>
                      <td className="px-6 py-4">-</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Sport - Intermediate</td>
                      <td className="px-6 py-4">8-12</td>
                      <td className="px-6 py-4">60 min</td>
                      <td className="px-6 py-4">200 zł</td>
                      <td className="px-6 py-4">350 zł</td>
                      <td className="px-6 py-4">-</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Sport - Youth</td>
                      <td className="px-6 py-4">12-18</td>
                      <td className="px-6 py-4">90 min</td>
                      <td className="px-6 py-4">250 zł</td>
                      <td className="px-6 py-4">370 zł</td>
                      <td className="px-6 py-4">-</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Ballet</td>
                      <td className="px-6 py-4">from age 5</td>
                      <td className="px-6 py-4">90+60 min</td>
                      <td className="px-6 py-4">240 zł</td>
                      <td className="px-6 py-4">-</td>
                      <td className="px-6 py-4">50 zł</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Individual Lessons Table */}
          <div>
            <div className="mb-6 text-center">
              <ShinyText as="h2" variant="title" className="inline-block text-3xl text-gold">
                Individual Lessons
              </ShinyText>
            </div>
            <div className="overflow-hidden rounded-xl border border-amber-900/30 bg-gray-900/40 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-amber-900/30 border-b bg-gray-900/60 text-gold">
                      <th className="px-6 py-4 font-cinzel font-semibold">Package</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Duration</th>
                      <th className="px-6 py-4 font-cinzel font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 text-gray-300">
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Single (1 lesson)</td>
                      <td className="px-6 py-4">45 min</td>
                      <td className="px-6 py-4">160 zł</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Beginner (5 lessons)</td>
                      <td className="px-6 py-4">750 zł</td>
                      <td className="px-6 py-4">600 zł</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Sport (10 lessons)</td>
                      <td className="px-6 py-4">1450 zł</td>
                      <td className="px-6 py-4">1100 zł</td>
                    </tr>
                    <tr className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">Champion (20 lessons)</td>
                      <td className="px-6 py-4">2600 zł</td>
                      <td className="px-6 py-4">2000 zł</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
