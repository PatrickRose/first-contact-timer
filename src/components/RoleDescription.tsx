import * as React from 'react';
import {Phase} from "../types/types";

const enum RoleName {
    LEADERS = 'Commune Leaders',
    PALADINS = 'Paladins of Lenus',
    KNIGHTS = 'Knights Medicæ',
    HOSPITAL = 'Wellspring / Swan\'s Cliff',
    OUTER_SOULS = 'Outer Souls Faculty',
    PRESS = 'Press',
    COMMUNE = 'Commune members',
    ADMINISTRATORS = 'Administrators',
}

type PhaseDescription = {
    [key in Phase]: string;
};

abstract class RoleDescription {
    private readonly roleName: RoleName;

    constructor(roleName: RoleName) {
      this.roleName = roleName;
    }

    render(phase: Phase) {
      const { roleName } = this;
      const phaseDescription = this.phaseDescription()[phase];

      return (
        <li key={roleName}>
          <strong>{roleName}</strong>
          {` ${phaseDescription}`}
        </li>
      );
    }

    // eslint-disable-next-line no-unused-vars
    protected abstract phaseDescription(): PhaseDescription;
}

class CommuneLeader extends RoleDescription {
    private readonly phaseAction = 'negotiate';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: 'Commune Co-Op',
        3: this.phaseAction,
      };
    }
}

class PaladinsOfLenus extends RoleDescription {
    private readonly phaseAction = 'perform ambulance actions';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
      };
    }
}

class KnightsMedicae extends RoleDescription {
    private readonly phaseAction = 'explore Swanshire';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
      };
    }
}

class WellspringHospital extends RoleDescription {
    private readonly phaseAction = 'Cure patients';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
      };
    }
}

class OuterSouls extends RoleDescription {
    private readonly phaseAction = 'perform research';

    protected phaseDescription(): PhaseDescription {
      return {
        1: this.phaseAction,
        2: this.phaseAction,
        3: this.phaseAction,
      };
    }
}

class Press extends RoleDescription {
    private readonly phaseAction = 'investigating stories';

    protected phaseDescription(): PhaseDescription {
      return {
        1: 'providing briefing',
        2: this.phaseAction,
        3: this.phaseAction,
      };
    }
}

class Commune extends RoleDescription {
    private readonly phaseAction = 'performing commune actions';

    protected phaseDescription(): PhaseDescription {
        return {
            1: this.phaseAction,
            2: this.phaseAction,
            3: 'negotiation',
        };
    }
}

class Administrator extends RoleDescription {
    private readonly phaseAction = 'Hospital Admin Board';

    protected phaseDescription(): PhaseDescription {
        return {
            1: this.phaseAction,
            2: this.phaseAction,
            3: 'negotiation',
        };
    }
}



const AllRoles: { [key in Phase]: RoleDescription[] } = {
    1: [
        new Commune(RoleName.COMMUNE),
        new Administrator(RoleName.ADMINISTRATORS),
        new Press(RoleName.PRESS)
    ],
    2: [
        new CommuneLeader(RoleName.LEADERS),
        new PaladinsOfLenus(RoleName.PALADINS),
        new KnightsMedicae(RoleName.KNIGHTS),
        new WellspringHospital(RoleName.HOSPITAL),
        new OuterSouls(RoleName.OUTER_SOULS),
        new Press(RoleName.PRESS)
    ],
    3: [
        new Commune(RoleName.COMMUNE),
        new Administrator(RoleName.ADMINISTRATORS),
        new Press(RoleName.PRESS)
    ]
}

export { AllRoles as default };
