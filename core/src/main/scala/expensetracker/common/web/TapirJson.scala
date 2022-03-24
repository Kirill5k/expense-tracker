package expensetracker.common.web

import expensetracker.common.JsonCodecs
import sttp.tapir.json.circe.TapirJsonCirce

transparent trait TapirJson extends TapirJsonCirce with JsonCodecs
