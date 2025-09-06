import { ReactNode } from "react";

export default function ServiceCard({title,desc,children}:{title:string,desc:string,children?:ReactNode}){
  return (
    <div className="card">
      <div className="h3">{title}</div>
      <p className="mt-2 text-ash">{desc}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
