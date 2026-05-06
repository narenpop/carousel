import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import CardStackCarousel from './components/CardStackCarousel'
import CardStackCarousel1 from './components/CardStackCarousel1'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center" className='h-90vh'>
       <CardStackCarousel />
      </section>
      <section id="spacer" className='h-100vh'>
       <CardStackCarousel1 />
      </section>
    </>
  )
}

export default App
