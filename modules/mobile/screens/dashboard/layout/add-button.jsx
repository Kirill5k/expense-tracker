import {Fab, FabIcon} from "@/components/ui/fab";
import {MaterialIcon} from "@/components/ui/icon/index";
import colors from '@/constants/colors';

const AddButton = ({onPress, mode}) => {
  return (
      <Fab
          onPress={onPress}
          placement="bottom right"
          className="bg-background-50"
      >
        <FabIcon
            as={MaterialIcon}
            className="fill-typography-50 text-primary-100"
            code="plus"
            displaySize={18}
            displayColor={colors[mode].text}
        />
      </Fab>
  )
}

export default AddButton