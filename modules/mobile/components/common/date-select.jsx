import React, {useState} from 'react'
import DateTimePicker from 'react-native-ui-datepicker'
import {Button, ButtonIcon, ButtonText} from "../ui/button";
import {Box} from "../ui/box";
import {HStack} from "../ui/hstack";
import {MaterialIcon} from "../ui/icon";
import {Modal, ModalBackdrop, ModalContent, ModalBody} from "../ui/modal";
import colors from '@/constants/colors'
import dayjs from 'dayjs'
import {format} from 'date-fns'

const DateSelect = ({value, onSelect, mode}) => {
  const [show, setShow] = useState(false)

  return (
      <>
        <Button
            size="sm"
            variant="outline"
            action="secondary"
            className="justify-between align-center"
            onPress={() => setShow(true)}
        >
          <ButtonIcon
              as={MaterialIcon}
              code="calendar"
              dcolor={colors[mode].text}
              dsize={20}
              className="flex-grow-0"
          />
          <ButtonText className="flex-grow px-2">
            {format(value, 'dd/MM/yyyy')}
          </ButtonText>
          <ButtonIcon
              className="flex-grow-0"
              as={MaterialIcon}
              code={show ? 'chevron-up' : 'chevron-down'}
              dcolor={value ? colors[mode].tabIconSelected : colors[mode].text}
          />
        </Button>
        <Modal
            isOpen={show}
            onClose={() => setShow(false)}
            size="md"
        >
          <ModalBackdrop/>
          <ModalContent className="px-1 py-0 my-0">
            <ModalBody>
              <DateTimePicker
                  mode="single"
                  date={dayjs(value)}
                  onChange={(params) => {
                    onSelect(params.date.toDate())
                    setTimeout(() => setShow(false), 200)
                  }}
                  headerButtonColor={colors[mode].tint}
                  selectedItemColor={colors[mode].tint}
                  selectedTextStyle={{
                    fontWeight: 'bold',
                    color: colors[mode].background,
                  }}
                  calendarTextStyle={{
                    color: colors[mode].text,
                  }}
                  headerTextStyle={{
                    fontWeight: 'bold',
                    color: colors[mode].text,
                  }}
                  weekDaysTextStyle={{
                    color: colors[mode].text,
                  }}
                  todayTextStyle={{
                    fontWeight: 'bold'
                  }}
              />
              <HStack className="mx-3 justify-end" space="sm">
                <Button
                    size="xs"
                    variant="outline"
                    action="secondary"
                    onPress={() => {
                      setShow(false)
                    }}
                >
                  <ButtonText>
                    Cancel
                  </ButtonText>
                </Button>
                <Button
                    size="xs"
                    action="secondary"
                    className={`${mode === 'light' ? 'bg-blue-600' : 'bg-blue-300'}`}
                    onPress={() => {
                      onSelect(new Date())
                      setShow(false)
                    }}
                >
                  <ButtonText>
                    Today
                  </ButtonText>
                </Button>
              </HStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
  )
}

export default DateSelect