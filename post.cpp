#include "emscripten.h"

extern "C" {

int EMSCRIPTEN_KEEPALIVE _GetNumJoints() {
      return GetNumJoints();
}

char* EMSCRIPTEN_KEEPALIVE _ComputeFk(const IkReal* j) {
    IkReal eetrans[3] = {0};
    IkReal eerot[9] = {0};
    char buffer [256] = {0};
    ComputeFk(j, eetrans, eerot);
    for(int i = 0; i < 3; ++i)
        sprintf(buffer + strlen(buffer), "%.15f,", eetrans[i]);
    for(int i = 0; i < 9 - 1; ++i)
        sprintf(buffer + strlen(buffer), "%.15f,", eerot[i]);
    sprintf(buffer + strlen(buffer), "%.15f", eerot[9 - 1]);
    return buffer;
}
//
//std::vector<IkReal> TrueComputeIk(int argc, char** argv) {
//    std::vector<IkReal> solvalues(GetNumJoints());
//    if( argc != 12+GetNumFreeParameters()+1 ) {
//        printf("\nKAKAKAK Usage: ./ik r00 r01 r02 t0 r10 r11 r12 t1 r20 r21 r22 t2 free0 ...\n\n"
//               "Returns the ik solutions given the transformation of the end effector specified by\n"
//               "a 3x3 rotation R (rXX), and a 3x1 translation (tX).\n"
//               "There are %d free parameters that have to be specified.\n\n",GetNumFreeParameters());
//    }
//
//    IkSolutionList<IkReal> solutions;
//    std::vector<IkReal> vfree(GetNumFreeParameters());
//    IkReal eerot[9],eetrans[3];
//    eerot[0] = atof(argv[1]); eerot[1] = atof(argv[2]); eerot[2] = atof(argv[3]); eetrans[0] = atof(argv[4]);
//    eerot[3] = atof(argv[5]); eerot[4] = atof(argv[6]); eerot[5] = atof(argv[7]); eetrans[1] = atof(argv[8]);
//    eerot[6] = atof(argv[9]); eerot[7] = atof(argv[10]); eerot[8] = atof(argv[11]); eetrans[2] = atof(argv[12]);
//    for(std::size_t i = 0; i < vfree.size(); ++i)
//        vfree[i] = atof(argv[13+i]);
//    bool bSuccess = ComputeIk(eetrans, eerot, vfree.size() > 0 ? &vfree[0] : NULL, solutions);
//
//    if( !bSuccess ) {
//        fprintf(stderr,"Failed to get ik solution\n");
//    }
//
//    printf("Found %d ik solutions:\n", (int)solutions.GetNumSolutions());
//    for(std::size_t i = 0; i < solutions.GetNumSolutions(); ++i) {
//        const IkSolutionBase<IkReal>& sol = solutions.GetSolution(i);
//        printf("sol%d (free=%d): ", (int)i, (int)sol.GetFree().size());
//        std::vector<IkReal> vsolfree(sol.GetFree().size());
//        sol.GetSolution(&solvalues[0],vsolfree.size()>0?&vsolfree[0]:NULL);
//        for( std::size_t j = 0; j < solvalues.size(); ++j)
//            printf("%.15f, ", solvalues[j]);
//        printf("\n");
//    }
//    return solvalues;
//}

}
