import {Fab, FabIcon} from "@/components/ui/fab";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@/constants/colors';

const Icon = ({mode}) => (
    <MaterialCommunityIcons
        name="plus"
        size={18}
        color={colors[mode].text}
    />
)

const AddButton = ({onPress, mode}) => {
  return (
      <Fab
          onPress={onPress}
          placement="bottom right"
          className="bg-background-50"
      >
        <FabIcon
            as={Icon}
            className="fill-typography-50 text-primary-100"
            mode={mode}
        />
      </Fab>
  )
}

export default AddButton