import {VStack} from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";
import TransactionList from './transaction-list'
import AddButton from '@/screens/dashboard/layout/add-button'

const transactions = [
  {
    id: "66e2ac88a975be56fa2b9210",
    kind: "income",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 5.5,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-12",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66e2ac88a975be56fa2b92a9",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 5.5,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-12",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66e2aca0a975be56fa2b92aa",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 6,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-12",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66e2acaaa975be56fa2b92ab",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 5.05,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-12",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66e2acbda975be56fa2b92ac",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 7.96,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-12",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66e2acd1a975be56fa2b92ad",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 3.83,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-12",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66debc40ba73491ddc832026",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa551",
    amount: {
      value: 80,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-09",
    note: null,
    tags: [
      "electric"
    ],
    category: {
      id: "61041a74937c172e4baaa551",
      name: "Bills",
      icon: "mdi-gauge",
      kind: "expense",
      color: "#304FFE"
    }
  },
  {
    id: "66debcaaba73491ddc832029",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 6.6,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-09",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66debcb0ba73491ddc83202a",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 6.01,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-09",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66debcbbba73491ddc83202b",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 5.99,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-09",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66debc30ba73491ddc832025",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa54b",
    amount: {
      value: 108.3,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-08",
    note: null,
    tags: [
      "london",
      "train"
    ],
    category: {
      id: "61041a74937c172e4baaa54b",
      name: "Transport",
      icon: "mdi-bus",
      kind: "expense",
      color: "#FF6D00"
    }
  },
  {
    id: "66debc61ba73491ddc832027",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa549",
    amount: {
      value: 31.25,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-07",
    note: "Test Note",
    tags: [
      "london",
      "yana"
    ],
    category: {
      id: "61041a74937c172e4baaa549",
      name: "Restaraunts",
      icon: "mdi-silverware",
      kind: "expense",
      color: "#FFC400"
    }
  },
  {
    id: "66debd15ba73491ddc83202d",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa54b",
    amount: {
      value: 12.13,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-07",
    note: null,
    tags: [
      "london",
      "uber",
      "yana"
    ],
    category: {
      id: "61041a74937c172e4baaa54b",
      name: "Transport",
      icon: "mdi-bus",
      kind: "expense",
      color: "#FF6D00"
    }
  },
  {
    id: "66debd3cba73491ddc83202e",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa549",
    amount: {
      value: 25.5,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-07",
    note: null,
    tags: [
      "sky-garden",
      "yana",
      "london"
    ],
    category: {
      id: "61041a74937c172e4baaa549",
      name: "Restaraunts",
      icon: "mdi-silverware",
      kind: "expense",
      color: "#FFC400"
    }
  },
  {
    id: "66debd77ba73491ddc83202f",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa54b",
    amount: {
      value: 7,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-07",
    note: null,
    tags: [
      "oyster",
      "london"
    ],
    category: {
      id: "61041a74937c172e4baaa54b",
      name: "Transport",
      icon: "mdi-bus",
      kind: "expense",
      color: "#FF6D00"
    }
  },
  {
    id: "66debcfaba73491ddc83202c",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa54b",
    amount: {
      value: 143.8,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-06",
    note: null,
    tags: [
      "yana",
      "train",
      "london"
    ],
    category: {
      id: "61041a74937c172e4baaa54b",
      name: "Transport",
      icon: "mdi-bus",
      kind: "expense",
      color: "#FF6D00"
    }
  },
  {
    id: "66debc8cba73491ddc832028",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa547",
    amount: {
      value: 83.2,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-05",
    note: null,
    tags: [
      "running-shoes",
      "asos"
    ],
    category: {
      id: "61041a74937c172e4baaa547",
      name: "Shopping",
      icon: "mdi-shopping",
      kind: "expense",
      color: "#C51162"
    }
  },
  {
    id: "66d6eef1fb17040129d429fd",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa550",
    amount: {
      value: 110.93,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-03",
    note: null,
    tags: [
      "yana",
      "london",
      "hotel"
    ],
    category: {
      id: "61041a74937c172e4baaa550",
      name: "Holidays",
      icon: "mdi-bag-carry-on",
      kind: "expense",
      color: "#00BFA5"
    }
  },
  {
    id: "66d6ef1cfb17040129d429fe",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 6.79,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-03",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66d6ef25fb17040129d429ff",
    kind: "expense",
    categoryId: "6104f79c01728b1b40758bb6",
    amount: {
      value: 9.05,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-03",
    note: null,
    tags: [],
    category: {
      id: "6104f79c01728b1b40758bb6",
      name: "Ebay / cex",
      icon: "mdi-google-controller",
      kind: "expense",
      color: "#EE0000"
    }
  },
  {
    id: "66d75d9dfb17040129d42a00",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa551",
    amount: {
      value: 658.14,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-03",
    note: null,
    tags: [
      "service-charge"
    ],
    category: {
      id: "61041a74937c172e4baaa551",
      name: "Bills",
      icon: "mdi-gauge",
      kind: "expense",
      color: "#304FFE"
    }
  },
  {
    id: "66d75db2fb17040129d42a01",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa551",
    amount: {
      value: 250,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-03",
    note: null,
    tags: [
      "ground-rent"
    ],
    category: {
      id: "61041a74937c172e4baaa551",
      name: "Bills",
      icon: "mdi-gauge",
      kind: "expense",
      color: "#304FFE"
    }
  },
  {
    id: "66d1d5f17ba69c3ccdb73dbd",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa551",
    amount: {
      value: 18.5,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-01",
    note: null,
    tags: [
      "internet"
    ],
    category: {
      id: "61041a74937c172e4baaa551",
      name: "Bills",
      icon: "mdi-gauge",
      kind: "expense",
      color: "#304FFE"
    }
  },
  {
    id: "66d5fb511dc2114873e21176",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa54a",
    amount: {
      value: 300,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-01",
    note: null,
    tags: [
      "mom"
    ],
    category: {
      id: "61041a74937c172e4baaa54a",
      name: "Transfer",
      icon: "mdi-send",
      kind: "expense",
      color: "#6200EA"
    }
  },
  {
    id: "66d5fb581dc2114873e21177",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa551",
    amount: {
      value: 155,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-01",
    note: null,
    tags: [
      "council-tax"
    ],
    category: {
      id: "61041a74937c172e4baaa551",
      name: "Bills",
      icon: "mdi-gauge",
      kind: "expense",
      color: "#304FFE"
    }
  },
  {
    id: "66d5fb611dc2114873e21178",
    kind: "expense",
    categoryId: "61041a74937c172e4baaa546",
    amount: {
      value: 300,
      currency: {
        code: "GBP",
        symbol: "£"
      }
    },
    date: "2024-09-01",
    note: null,
    tags: [],
    category: {
      id: "61041a74937c172e4baaa546",
      name: "Groceries",
      icon: "mdi-cart",
      kind: "expense",
      color: "#EBFE30"
    }
  }
]

export const Transactions = () => {
  //TODO: Get mode from state
  return (
      <VStack
          className="p-4 pb-0 md:px-10 md:pt-6 md:pb-0 h-full w-full max-w-[1500px] self-center bg-background-0"
          space="xl"
      >
        <Heading size="2xl" className="font-roboto">
          Transactions
        </Heading>
        <TransactionList items={transactions}/>
        <AddButton
            onPress={() => console.log('adding new tx')}
            mode="light"
        />
      </VStack>
  )
}
