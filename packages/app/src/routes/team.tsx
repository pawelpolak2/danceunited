import { ShinyText } from '../components/ui'

const trainers = [
  {
    name: 'Anna Kowalska',
    role: 'Ballroom Dance',
    image: '/trainers/trainer_1.png',
    description: 'Multiple Polish Champion with 10 years of teaching experience.',
  },
  {
    name: 'Janusz Wiśniewski',
    role: 'Ballroom Dance',
    image: '/trainers/trainer_ballroom_male.png',
    description: 'Expert in standard ballroom dances, international judge.',
  },
  {
    name: 'Maria Wiśniewska',
    role: 'Contemporary Dance',
    image: '/trainers/trainer_3.png',
    description: 'Specialist in technique and artistic expression in dance.',
  },
  {
    name: 'Krzysztof Zieliński',
    role: 'Salsa & Bachata',
    image: '/trainers/trainer_4.png',
    description: 'Feel the rhythm of Latin dances under the guidance of an experienced dancer.',
  },
  {
    name: 'Katarzyna Lewandowska',
    role: 'Ballet for Kids',
    image: '/trainers/trainer_5.png',
    description: 'Patient and smiling instructor for the youngest talents.',
  },
  {
    name: 'Tomasz Dąbrowski',
    role: 'Breakdance',
    image: '/trainers/trainer_6.png',
    description: 'Master of acrobatics and style, teaches you to control your body.',
  },
]

export default function Team() {
  return (
    <div className="container mx-auto px-4 pt-4 pb-12">
      <div className="mb-12 text-center">
        <ShinyText as="h1" variant="title" className="!block !w-full mb-4 text-center text-5xl">
          Our Team
        </ShinyText>
        <ShinyText as="p" variant="body" className="!block mx-auto max-w-2xl text-center text-gray-300 text-xl">
          Our team is a group of enthusiasts, experienced dancers, and educators who share their knowledge with commitment. Meet the people who will introduce you to the world of dance!
        </ShinyText>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {trainers.map((trainer) => (
          <div
            key={trainer.name}
            className="group relative overflow-hidden rounded-xl border border-amber-900/20 bg-gray-900/40 p-6 transition-all hover:bg-gray-900/60"
          >
            <div className="mb-4 aspect-[3/4] overflow-hidden rounded-lg">
              <img
                src={trainer.image}
                alt={trainer.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="text-center">
              <ShinyText as="h3" variant="title" className="mb-1 text-2xl text-gold">
                {trainer.name}
              </ShinyText>
              <ShinyText
                as="p"
                variant="body"
                className="mb-3 font-semibold text-amber-500 text-sm uppercase tracking-wider"
              >
                {trainer.role}
              </ShinyText>
              <p className="text-gray-300">{trainer.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
