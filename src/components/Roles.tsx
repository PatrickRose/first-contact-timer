import * as React from 'react';
import AllRoles from './RoleDescription';
import {Phase} from "../types/types";

interface RoleProps {
    phaseNumber: Phase
}

export default function Roles(props: RoleProps) {
  const { phaseNumber } = props;

  return (
    <div className="container text-3xl flex-1 flex 2items-center">
      <ul className="list-unstyled">
        {
            AllRoles[phaseNumber].map(
              role => role.render(phaseNumber)
            )
        }
      </ul>
    </div>
  );
}
