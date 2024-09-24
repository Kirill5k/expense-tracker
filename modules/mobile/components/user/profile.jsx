import {VStack} from '@/components/ui/vstack'
import {Text} from '@/components/ui/text'
import {Avatar, AvatarFallbackText} from '@/components/ui/avatar'

const Profile = ({user}) => {
  const fullName = `${user.firstName} ${user.lastName}`
  return (
    <VStack className="w-full items-center" space="lg">
      <Avatar size="xl" className="bg-info-500">
        <AvatarFallbackText className="text-white">{fullName}</AvatarFallbackText>
      </Avatar>
      <VStack className="gap-1 w-full items-center">
        <Text size="2xl" className="font-roboto text-dark">
          {fullName}
        </Text>
        <Text className="font-roboto text-sm text-typograpphy-700">
          {user.email}
        </Text>
      </VStack>
    </VStack>
  )
}

export default Profile