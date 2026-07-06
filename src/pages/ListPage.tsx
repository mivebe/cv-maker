// import { useEffect, useState } from 'react'

// const data = ['asd', 'fgh', 'jkl', 'zxc']

// const fetchData = (): Promise<string[]> => {
//   return new Promise((resolve) => {
//     setTimeout(() => resolve(data), 800)
//   })
// }

// export default function ListPage() {
//   const [items, setItems] = useState<string[]>([])
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     fetchData().then((result) => {
//       setItems(result)
//       setIsLoading(false)
//     })
//   }, [])

//   return (
//     <>
//       <h1>List Page</h1>
//       {isLoading ? (
//         <p>Loading…</p>
//       ) : (
//         <ul>
//           {items.map((item) => (
//             <li key={item}>{item}</li>
//           ))}
//         </ul>
//       )}
//     </>
//   )
// }


import { useEffect, useState } from "react";

const data = [
  'asd', 'fgh', 'jkl', 'zxc'
];

const fetchData = (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 1000);
  })
}

export default function ListPage() {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData().then((result) => {
      setItems(result);
      setIsLoading(false);
    })
  }, [])

  return (
    <>
      <h1>List Page</h1>
      {isLoading ? <>
        <p>Laoding....</p>
      </> : <>
        <ul>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      </>}
    </>
  )
}

