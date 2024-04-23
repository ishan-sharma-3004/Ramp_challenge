import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, loading: employeeLoading, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, loading: paginatedTransactionsLoading, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, loading: transactionsByEmployeeLoading, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => {
      if (paginatedTransactions !== null) {
        return paginatedTransactions.data
      } else {
        return transactionsByEmployee
      }
    },
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    try {
      await employeeUtils.fetchAll()
      await paginatedTransactionsUtils.fetchAll()
    } catch (error) {
      console.error("Error loading transactions:", error)
      // Handle error here
    } finally {
      setIsLoading(false)
    }
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      try {
        await transactionsByEmployeeUtils.fetchById(employeeId)
      } catch (error) {
        console.error("Error loading transactions by employee:", error)
        // Handle error here
      }
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (!employeeLoading && employees === null) {
      loadAllTransactions()
    }
  }, [employeeLoading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading || employeeLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsLoading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
