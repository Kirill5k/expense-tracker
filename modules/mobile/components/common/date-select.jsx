import React, {useState} from 'react'
import {Button, ButtonIcon, ButtonText} from "../ui/button";
import {MaterialIcon} from "../ui/icon";
import colors from '@/constants/colors'

const DatePicker = ({value, onChange, mode}) => {
  const [show, setShow] = useState(false)

  return (
      <Box>
        <Button
            size="sm"
            variant="outline"
            action="secondary"
            className="justify-between align-center"
        >
          <ButtonIcon
              as={MaterialIcon}
              code="calendar"
              dcolor={colors[mode].text}
              dsize={20}
              className="flex-grow-0"
          />
          <ButtonText className={`flex-grow ${value?.icon ? 'px-2' : 'px-1'}`}>
            {value?.name ? value.name : 'Category'}
          </ButtonText>
          <ButtonIcon
              className="flex-grow-0"
              as={MaterialIcon}
              code={isOpen ? 'chevron-up' : 'chevron-down'}
              dcolor={value ? colors[mode].tabIconSelected : colors[mode].text}
          />
        </Button>
      </Box>
  )

}

export default DatePicker