import openravepy

from optparse import OptionParser
import os, errno
import shutil

import logging
logging.basicConfig()

def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else: raise

@openravepy.with_destroy
def run(args=None):
    parser = OptionParser(description='generate a single ik solver')
    parser.add_option('--scene',action="store",type='string',dest='scene',default='data/lab1.env.xml',
                      help='Scene file to load (default=%default)')
    parser.add_option('--robotname',action="store",type='string',dest='robotname',default=None,
                      help='name of robotname to use (default=%default)')
    parser.add_option('--manipname',action="store",type='string',dest='manipname',default=None,
                      help='name of manipulator to use (default=%default)')
    (options, leftargs) = parser.parse_args(args=args)

    env = openravepy.Environment()
    env.Load(options.scene)
    robot = env.GetRobot(options.robotname)
    robot.SetActiveManipulator(options.manipname)

    # generate the ik solver
    ikmodel = openravepy.databases.inversekinematics.InverseKinematicsModel(robot, iktype=openravepy.IkParameterization.Type.Transform6D)
    if not ikmodel.load():
        ikmodel.autogenerate()
    
    # copy the file locally
    solverpath = './solvers/' + options.robotname + '-' + options.manipname + '.cpp'
    shutil.copyfile(ikmodel.getsourcefilename(), solverpath)

if __name__ == "__main__":
    run()
