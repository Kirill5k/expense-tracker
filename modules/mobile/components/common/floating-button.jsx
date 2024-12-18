import {Fab, FabIcon} from "@/components/ui/fab";
import {MaterialIcon} from "@/components/ui/icon";
import colors from '@/constants/colors';

const FloatingButton = ({onPress, mode, iconCode}) => {
  return (
      <Fab
          onPress={onPress}
          placement="bottom right"
          className=""
      >
        <FabIcon
            as={MaterialIcon}
            code={iconCode}
            dsize={26}
            dcolor={colors[mode].background}
        />
      </Fab>
  )
}

export default FloatingButton