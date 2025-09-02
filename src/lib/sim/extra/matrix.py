import sympy as sp
import complex as co

px,py, sx,sy, rot = sp.symbols("px,py, sx,sy, rot")


scamat = sp.Matrix([
    [sx,0,0,0],
    [0,sy,0,0],
    [0,0,1,0],
    [0,0,0,1],
])

posmat = sp.Matrix([
    [1,0,0,px],
    [0,1,0,py],
    [0,0,1,0],
    [0,0,0,1],
])


ax,ay = sp.symbols("ax,ay")

#A*B=C , matrixs
C = co.Complex(ax,ay).mult(co.Complex(sp.cos(rot), sp.sin(rot))).get_matrix()
B = sp.Matrix([[ax], [ay]])
A = co.findA(B, C)

rotmat = co.embed_in_identity(A,4)

modelmat = posmat * rotmat * scamat

viewmat = scamat * rotmat * posmat


w,h = sp.symbols("w,h")

projmat = sp.Matrix([
    [1/w,0,0,0],
    [0,1/h,0,0],
    [0,0,1,0],
    [0,0,0,1],
])

print("modelmat")
print(modelmat)
sp.pprint(modelmat)
print("\n")

print("viewmat")
print(viewmat)
sp.pprint(viewmat)
print("\n")

print("projmat")
print(projmat)
sp.pprint(projmat)
print("\n")
