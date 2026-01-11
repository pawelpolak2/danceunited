import { ShinyText } from '../components/ui'

export default function Pricing() {
  return (
    <div className="container mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Cennik
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl">
        Tutaj znajdziesz cennik naszych zajęć.
      </ShinyText>
    </div>
  )
}
