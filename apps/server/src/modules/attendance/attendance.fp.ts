// --- START OF FILE attendance.fp.ts ---
import { PrismaService } from '../../prisma.service';

// ============================================================================
// 1. THE FUNCTOR (F)
// Describes the domain operations without executing them.
// ============================================================================
export type ScopingF<Next> =
  | { readonly _tag: 'GetManagedEmployees'; readonly managerId: number; readonly next: (empIds: number[]) => Next }
  | { readonly _tag: 'FetchAttendance'; readonly employeeIds: number[]; readonly query: any; readonly next: (records: any[]) => Next };

export const mapScopingF = <A, B>(f: (a: A) => B, fa: ScopingF<A>): ScopingF<B> => {
  switch (fa._tag) {
    case 'GetManagedEmployees':
      return { ...fa, next: (empIds) => f(fa.next(empIds)) };
    case 'FetchAttendance':
      return { ...fa, next: (records) => f(fa.next(records)) };
  }
};

// ============================================================================
// 2. THE FREE MONAD
// A recursive data structure that builds an AST of our Functor.
// ============================================================================
export type Free<A> =
  | { readonly _tag: 'Pure'; readonly value: A }
  | { readonly _tag: 'Impure'; readonly functor: ScopingF<Free<A>> };

export const pure = <A>(value: A): Free<A> => ({ _tag: 'Pure', value });
export const impure = <A>(functor: ScopingF<Free<A>>): Free<A> => ({ _tag: 'Impure', functor });

// ============================================================================
// 3. F-COALGEBRA (UNFOLD)
// Generates the Free Monad AST from an initial state.
// ============================================================================
export type ScopingState =
  | { _tag: 'Init'; managerId: number; query: any }
  | { _tag: 'Fetch'; empIds: number[]; query: any }
  | { _tag: 'Done'; records: any[] };

export type CoalgebraResult<S, A> = { _tag: 'Continue'; functor: ScopingF<S> } | { _tag: 'Done'; value: A };
export type Coalgebra<S, A> = (state: S) => CoalgebraResult<S, A>;

export const scopingCoalgebra: Coalgebra<ScopingState, any[]> = (state) => {
  switch (state._tag) {
    case 'Init':
      return {
        _tag: 'Continue',
        functor: {
          _tag: 'GetManagedEmployees',
          managerId: state.managerId,
          next: (empIds) => ({ _tag: 'Fetch', empIds, query: state.query })
        }
      };
    case 'Fetch':
      return {
        _tag: 'Continue',
        functor: {
          _tag: 'FetchAttendance',
          employeeIds: state.empIds,
          query: state.query,
          next: (records) => ({ _tag: 'Done', records })
        }
      };
    case 'Done':
      return { _tag: 'Done', value: state.records };
  }
};

export const unfoldFree = <S, A>(coalg: Coalgebra<S, A>, state: S): Free<A> => {
  const result = coalg(state);
  if (result._tag === 'Done') {
    return pure(result.value);
  }
  return impure(mapScopingF((nextState) => unfoldFree(coalg, nextState), result.functor));
};

// ============================================================================
// 4. F-ALGEBRA (FOLD)
// Interprets the Free Monad AST into actual side-effects (Prisma calls).
// ============================================================================
export type Algebra<A> = (fa: ScopingF<Promise<A>>) => Promise<A>;

export const scopingAlgebra = (prisma: PrismaService): Algebra<any[]> => (fa) => {
  switch (fa._tag) {
    case 'GetManagedEmployees':
      return prisma.employee.findMany({
        where: { managerId: fa.managerId },
        select: { id: true }
      })
      .then(emps => emps.map(e => e.id))
      .then(fa.next);

    case 'FetchAttendance':
      // 1. Handle Pagination
      const take = fa.query.limit ? Number(fa.query.limit) : 31;
      const skip = fa.query.offset ? Number(fa.query.offset) : 0;

      // 2. Handle Date Filtering (Matching your service logic)
      const month = fa.query.month ? Number(fa.query.month) : new Date().getMonth() + 1;
      const year = fa.query.year ? Number(fa.query.year) : new Date().getFullYear();
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

      // 3. Handle Security Intersection
      // If manager filters by a specific employee, ensure they actually manage them
      let targetIds = fa.employeeIds;
      if (fa.query['filter[employeeId]']) {
        const requestedId = Number(fa.query['filter[employeeId]']);
        targetIds = targetIds.includes(requestedId) ? [requestedId] : [];
      }

      // If they manage no one, or requested an employee they don't manage, return empty
      if (targetIds.length === 0) {
        return Promise.resolve([]).then(fa.next);
      }

      return prisma.attendance.findMany({
        where: {
          employeeId: { in: targetIds },
          date: { gte: startDate, lte: endDate }
        },
        take,
        skip,
        orderBy: { date: 'asc' }
      })
      .then(fa.next);
  }
};

export const foldFree = <A>(alg: Algebra<A>, free: Free<A>): Promise<A> => {
  if (free._tag === 'Pure') {
    return Promise.resolve(free.value);
  }
  return alg(mapScopingF((nextFree) => foldFree(alg, nextFree), free.functor));
};

// ============================================================================
// 5. HYLOMORPHISM
// Fuses the Coalgebra (unfold) and Algebra (fold) into a single execution.
// ============================================================================
export const hylomorphism = <S, A>(alg: Algebra<A>, coalg: Coalgebra<S, A>, seed: S): Promise<A> => {
  return foldFree(alg, unfoldFree(coalg, seed));
};
// --- END OF FILE attendance.fp.ts ---