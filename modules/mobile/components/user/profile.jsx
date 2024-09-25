import {VStack} from '@/components/ui/vstack'
import {HStack} from '@/components/ui/hstack'
import {Text} from '@/components/ui/text'
import {Avatar, AvatarFallbackText, AvatarBadge} from '@/components/ui/avatar'
import {Icon, MaterialIcon} from '@/components/ui/icon'
import {format} from 'date-fns'

const Profile = ({user}) => {
  const fullName = `${user.firstName} ${user.lastName}`
  return (
    <HStack className="p-4 w-full items-center" space="xl">
      <Avatar size="xl" className="bg-info-500">
        <AvatarFallbackText className="text-white">{fullName}</AvatarFallbackText>
        <AvatarBadge className="justify-center items-center bg-white border border-outline-200">
          <Icon as={MaterialIcon} code="pencil" dcolor="text-primary-100" dsize={16} />
        </AvatarBadge>
      </Avatar>
      <VStack className="w-full items-left" space="xs">
        <Text size="2xl" className="font-roboto text-dark">
          {fullName}
        </Text>
        <Text className="font-roboto text-sm text-typograpphy-700">
          {user.email}
        </Text>
        <Text className="text-2xs">
          {user.totalTransactionCount} transactions since {format(new Date(user.registrationDate), 'dd MMM yyyy')}
        </Text>
      </VStack>
    </HStack>
  )
}

export default Profile