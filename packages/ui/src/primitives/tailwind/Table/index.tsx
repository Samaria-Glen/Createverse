/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import React, { ReactNode } from 'react'

export interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  className?: string
  children?: ReactNode
}

const TableHeaderCell = ({ className, children, ...props }: TableCellProps) => {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  )
}

const TableCell = ({ className, children, ...props }: TableCellProps) => {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  )
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string
  children?: ReactNode
}
const TableRow = ({ className, children, ...props }: TableRowProps) => {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  )
}

export interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
  children?: ReactNode
}

const TableHead = ({ className, children, ...props }: TableSectionProps) => {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

const TableBody = ({ className, children, ...props }: TableSectionProps) => {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string
  children?: ReactNode
}
const Table = ({ className, children }: { className?: string; children?: ReactNode }) => {
  return <table className={className}>{children}</table>
}

export default Table
export { TableHeaderCell, TableCell, TableRow, TableHead, TableBody, Table }
