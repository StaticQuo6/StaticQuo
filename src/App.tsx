import { FacadeGate } from './facade/FacadeGate'
import { usePermissions } from './shared/permissions/usePermissions'

function App() {
  usePermissions()
  return <FacadeGate />
}

export default App
