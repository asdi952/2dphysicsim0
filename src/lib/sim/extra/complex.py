import sympy as sp

class Complex:
    def __init__(self, r, i):
        self.r = r
        self.i = i

    def mult(self, c0:"Complex"):
        r = self.r*c0.r - self.i*c0.i
        i = self.r*c0.i + self.i*c0.r
        self.r = r
        self.i = i

        return self

    def __repr__(self):
        return f"({self.r} + ({self.i})i)"

    def get_matrix(self):
        return sp.Matrix([[self.r], [self.i]])


def findA(B:sp.Matrix,C:sp.Matrix) -> sp.Matrix:
    def vardependance(expr, var):
        eexpr = sp.expand(expr)
        de0 = eexpr.diff(var)
        de1 = de0.diff(var)

        assert de1 == 0, "this function only handle variable dep of order 1"
        return de0

    shapeB = sp.shape(B)
    shapeC = sp.shape(C)
    assert shapeB[1] == shapeC[1]

    A = sp.zeros(shapeB[0],shapeC[0])
    shapeA = sp.shape(A)

    for i,e in enumerate(C):
        for k,v in enumerate(B):
            depexpr = vardependance(e, v)
            A[i,k] = depexpr

    return A

def embed_in_identity(A: sp.Matrix, n: int) -> sp.Matrix:
    if A.rows > n or A.cols > n:
        raise ValueError("Target size must be larger than or equal to A’s size")
    M = sp.eye(n)              # start with identity
    M[:A.rows, :A.cols] = A    # overwrite top-left block with A
    return M