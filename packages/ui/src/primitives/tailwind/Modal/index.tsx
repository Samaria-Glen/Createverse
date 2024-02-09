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
import { MdClose } from 'react-icons/md'
import { twMerge } from 'tailwind-merge'
import Button from '../Button'
import Text from '../Text'

export interface ModalProps {
  title?: string
  className?: string
  children?: ReactNode
  onClose?: () => void
  onSubmit?: () => void
}

export const ModalHeader = ({ title, onClose }: { closeIcon?: boolean; title?: string; onClose?: () => void }) => {
  return (
    <div className="relative flex justify-center items-center px-6 py-3 border-b border-[#e5e7eb]">
      {title && <Text>{title}</Text>}
      <Button variant="outline" className="border-0 absolute right-0" startIcon={<MdClose />} onClick={onClose} />
    </div>
  )
}

export const ModalFooter = ({ onClose, onSubmit }) => {
  return (
    <div className="grid grid-cols-12 gap-6 pt-5 border-t border-[#e5e7eb]">
      <Button fullWidth className="col-span-12 md:col-span-6" size="small" onClick={onClose}>
        Close
      </Button>

      <Button fullWidth className="col-span-12 md:col-span-6" size="small" onClick={onSubmit}>
        Submit
      </Button>
    </div>
  )
}

const Modal = ({ title, onClose, children, className }: ModalProps) => {
  const twClassName = twMerge('rounded-xl shadow transition-all bg-theme-primary')

  return (
    <div onClick={(e) => e.stopPropagation()} className={twClassName}>
      <ModalHeader title={title} onClose={onClose} />
      <div className="w-full px-10 py-6">{children}</div>
    </div>
  )
}

export default Modal
