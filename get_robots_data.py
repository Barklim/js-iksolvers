import openravepy
import json
import os

def run(args=None):

    data = {
        'robots': []
    }

    (_, _, filenames) = os.walk('collada_robots').next()
    for f in filenames:
        filename = os.path.abspath(os.path.join('robots', f))
        print 'loading from ' + filename
        env = openravepy.Environment()
        env.Load(filename)
        with env:
            robots = env.GetRobots()
            if len(robots) > 0:
                robot = env.GetRobots()[0]
                if robot is not None:
                    for manip in robot.GetManipulators():
                        data['robots'].append({
                            'scene': filename,
                            'robotname': robot.GetName(),
                            'manipname': manip.GetName()
                        })

    with open('robots_data.json', 'w') as outfile:
      json.dump(data, outfile, indent=2)

if __name__ == "__main__":
    run()
