import { ShinyText } from '../components/ui'

const trainers = [
  {
    name: 'Anna Kowalska',
    role: 'Taniec Towarzyski',
    image: '/trainers/trainer_1.png',
    description: 'Wielokrotna mistrzyni Polski z 10-letnim doświadczeniem w nauczaniu.',
  },
  {
    name: 'Janusz Wiśniewski',
    role: 'Taniec Towarzyski',
    image: '/trainers/trainer_ballroom_male.png',
    description: 'Ekspert w standardowych tańcach towarzyskich, sędzia międzynarodowy.',
  },
  {
    name: 'Maria Wiśniewska',
    role: 'Taniec Współczesny',
    image: '/trainers/trainer_3.png',
    description: 'Specjalistka od techniki i wyrazu artystycznego w tańcu.',
  },
  {
    name: 'Krzysztof Zieliński',
    role: 'Salsa & Bachata',
    image: '/trainers/trainer_4.png',
    description: 'Poczuj rytm latynoskich tańców pod okiem doświadczonego tancerza.',
  },
  {
    name: 'Katarzyna Lewandowska',
    role: 'Balet dla dzieci',
    image: '/trainers/trainer_5.png',
    description: 'Cierpliwa i pełna uśmiechu instruktorka najmłodszych talentów.',
  },
  {
    name: 'Tomasz Dąbrowski',
    role: 'Breakdance',
    image: '/trainers/trainer_6.png',
    description: 'Mistrz akrobacji i stylu, nauczy Cię panować nad ciałem.',
  },
]

export default function Team() {
  return (
    <div className="container mx-auto px-4 pt-4 pb-12">
      <div className="mb-12 text-center">
        <ShinyText as="h1" variant="title" className="!block !w-full mb-4 text-center text-5xl">
          Nasza Kadra
        </ShinyText>
        <ShinyText as="p" variant="body" className="!block mx-auto max-w-2xl text-center text-gray-300 text-xl">
          Nasz zespół to grupa pasjonatów, doświadczonych tancerzy i pedagogów, którzy z zaangażowaniem dzielą się swoją
          wiedzą. Poznaj ludzi, którzy wprowadzą Cię w świat tańca!
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
